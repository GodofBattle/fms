const logger = require(`./fileLogger`).file;

const multer = require(`multer`);
const path = require(`path`);
const fs = require(`fs`);

// by shkoh 20200622: Group Image가 저장될 위치를 지정(./public/img/group)
// by shkoh 20200622: 해당 위치에 디렉토리가 없는 경우 새로 생성함
const image_dir = path.join(__dirname, `..`, `public`, `img`, `diagram`);
fs.existsSync(image_dir) || fs.mkdirSync(image_dir);

// by shkoh 20200619: multer를 통한 저장 방법 정의
// by shkoh 20200619: destination --> 업로드한 파일의 저장 위치 지정
// by shkoh 20200619: filename --> 업로드한 파일의 저장되는 파일의 명칭 지정, 동일한 파일명을 가지고 있는 경우에 덮어 쓴다
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        try {
            const field_dir = path.join(image_dir, file.fieldname);
            fs.existsSync(field_dir) || fs.mkdirSync(field_dir);

            // by shkoh 20200923: 파일을 저장하기 전에 (기본 폴더)/(file의 field명)/을 가진 디렉토리가 있는지 확인하 후 있다면 안의 모든 파일들을 삭제하며, 존재하지 않는다면 새로 폴더를 생성함
            const saved_dir = path.join(image_dir, file.fieldname, req.query.type);
            if(fs.existsSync(saved_dir)) {
                const files = fs.readdirSync(saved_dir);
                files.forEach((file) => {
                    fs.unlinkSync(path.join(saved_dir, file));
                });
            } else {
                fs.mkdirSync(saved_dir);
            }

            callback(null, saved_dir);
        } catch(err) {
            logger.error(err);
            const saved_dir = path.join(image_dir, file.fieldname);
            callback(err, saved_dir);
        }
    },
    filename: (req, file, callback) => {
        try {
            let file_name = file.originalname.normalize('NFC');
            if(req.query.rename) {
                let file_ext = file.originalname.normalize('NFC').split('.');
                file_name = req.query.rename + '.' + file_ext[file_ext.length - 1];
            };
            callback(null, file_name);
        } catch(err) {
            logger.error(err);
            callback(err, file.originalname);
        }
    }
});

const upload = multer({ storage: storage });

module.exports = upload;