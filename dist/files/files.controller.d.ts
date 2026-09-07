import { FilesService } from './files.service';
export declare class FilesController {
    private filesService;
    constructor(filesService: FilesService);
    getFileConfig(): import("./files.service").FileConfig;
}
