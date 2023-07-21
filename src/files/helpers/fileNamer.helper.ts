import { v4 as uuid } from "uuid";


export const fileNamer = (req: Express.Request, file: Express.Multer.File, callback: Function) => {
    
    
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
    }

    const fileExtension = file.mimetype.split('/')[1];
    
    const fileName = `${uuid()}.${fileExtension}`

    callback(null, 'nuevo nombre');
}