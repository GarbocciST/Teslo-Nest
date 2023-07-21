

export const fileFilter = (req: Express.Request, file: Express.Multer.File, callback: Function) => {
    
    
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
    }

    callback(null, true);
}