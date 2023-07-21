import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, ParseFilePipe, UseInterceptors, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { fileFilter, fileNamer } from './helpers';
import { Response } from 'express';


@Controller('files')
export class FilesController {
    constructor(
        private readonly filesService: FilesService,
        private readonly configService: ConfigService
    ) {}
 
    @Get('product: imageName')
    findOneImage( @Res() res: Response, @Param('imageName') imageName: string ) {
        const path = this.filesService.getStaticProductImage(imageName);

        res.sendFile(path);
    }

    @Post('product')
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: fileFilter,
        
        storage: diskStorage({
            destination: './static/uploads',
            filename: fileNamer
        })
    }))
    uploadFileAndPassValidation(
        @UploadedFile() file: Express.Multer.File
    ) {

        if (!file) {
            throw new BadRequestException('Make sure that the file is an image!')
        }

        const secureUrl = `${this.configService.get('HOST_API')}/files/product/${file.filename}`;
        return { secureUrl };
    }


}
