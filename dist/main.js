"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: ['http://localhost:5173', 'https://your-production-frontend.com'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(app.get(nestjs_pino_1.Logger)), new http_exception_filter_1.HttpExceptionFilter(app.get(nestjs_pino_1.Logger)));
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('AI Voice Sales Agent API')
        .setDescription('Backend for AI outbound voice sales agent using Vapi, Sarvam AI, OpenAI, WhatsApp and Google Calendar')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.listen(port, '0.0.0.0');
    app.get(nestjs_pino_1.Logger).log(`Application running on port ${port}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map