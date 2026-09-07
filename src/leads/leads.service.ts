import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadTemperature } from './lead.schema';
import { ExtractedLeadData } from '../ai/lead-extraction.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(@InjectModel(Lead.name) private leadModel: Model<Lead>) { }

  async createOrUpdateFromExtraction(
    callId: Types.ObjectId | string,
    phoneNumber: string,
    extraction: ExtractedLeadData,
    rawAiExtraction?: Record<string, any>,
  ): Promise<Lead> {
    const callObjectId = typeof callId === 'string' ? new Types.ObjectId(callId) : callId;

    // Find existing lead for this call, or create one
    let lead = await this.leadModel.findOne({ callId: callObjectId }).exec();

    const updateData: Record<string, any> = {
      name: extraction.name,
      productDescription: extraction.productDescription,
      productCount: extraction.productCount,
      budget: extraction.budget,
      currency: extraction.currency,
      timeline: extraction.timeline,
      requiredFeatures: extraction.requiredFeatures,
      painPoints: extraction.painPoints,
      isDecisionMaker: extraction.isDecisionMaker,
      barriers: extraction.barriers,
      objections: extraction.objections,
      buyingSignals: extraction.buyingSignals,
      language: extraction.language,
      rawAiExtraction: rawAiExtraction || extraction,
    };

    if (lead) {
      // Merge arrays instead of replacing
      updateData.requiredFeatures = [...new Set([...lead.requiredFeatures, ...extraction.requiredFeatures])];
      updateData.painPoints = [...new Set([...lead.painPoints, ...extraction.painPoints])];
      updateData.barriers = [...new Set([...lead.barriers, ...extraction.barriers])];
      updateData.objections = [...new Set([...lead.objections, ...extraction.objections])];
      updateData.buyingSignals = [...new Set([...lead.buyingSignals, ...extraction.buyingSignals])];

      // Don't overwrite existing non-null values with null
      for (const key of ['name', 'productDescription', 'productCount', 'budget', 'currency', 'timeline', 'isDecisionMaker']) {
        if (updateData[key] === null || updateData[key] === undefined) {
          updateData[key] = (lead as any)[key];
        }
      }

      Object.assign(lead, updateData);
      return lead.save();
    }

    lead = new this.leadModel({
      callId: callObjectId,
      phoneNumber,
      temperature: 'UNKNOWN' as LeadTemperature,
      intentScore: 0,
      confidence: 0,
      ...updateData,
    });
    return lead.save();
  }

  async updateQualification(
    leadId: Types.ObjectId | string,
    temperature: LeadTemperature,
    intentScore: number,
    confidence: number,
    evidence: string[],
    reasoning: string,
  ): Promise<Lead> {
    const lead = await this.leadModel
      .findByIdAndUpdate(
        leadId,
        { temperature, intentScore, confidence, evidence, reasoning },
        { new: true },
      )
      .exec();
    if (!lead) throw new NotFoundException(`Lead ${leadId} not found`);
    return lead;
  }

  async markHotWhatsappSent(leadId: Types.ObjectId | string): Promise<void> {
    await this.leadModel.findByIdAndUpdate(leadId, { hotWhatsappSent: true }).exec();
  }

  async hasHotWhatsappBeenSent(leadId: Types.ObjectId | string): Promise<boolean> {
    const lead = await this.leadModel.findById(leadId).select('hotWhatsappSent').exec();
    return Boolean(lead?.hotWhatsappSent);
  }

  async getLeadById(id: string): Promise<Lead> {
    const lead = await this.leadModel.findById(id).exec();
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  async getLeadByCallId(callId: Types.ObjectId | string): Promise<Lead | null> {
    const callObjectId = typeof callId === 'string' ? new Types.ObjectId(callId) : callId;
    const lead = await this.leadModel
      .findOne({ callId: callObjectId })
      .exec();

    return lead;
  }

  async getLeads(query: {
    page?: number;
    limit?: number;
    temperature?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ leads: Lead[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (query.temperature) filter.temperature = query.temperature;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phoneNumber: { $regex: query.search, $options: 'i' } },
        { productDescription: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const [leads, total] = await Promise.all([
      this.leadModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.leadModel.countDocuments(filter).exec(),
    ]);

    return { leads, total, page, limit };
  }
}
