const logger = require(`./fileLogger`).file;

const multer = require(`multer`);
const path = require(`path`);
const fs = require(`fs`);

// by shkoh 20200622: Group Image가 저장될 위치를 지정(./public/img/group)
// by shkoh 20200622: 해당 위치에 디렉토리가 없는 경우 새로 생성함
const image_group_dir = path.join(__dirname, `..`, `public`, `img`, `asset`);
fs.existsSync(image_group_dir) || fs.mkdirSync(image_group_dir);

// by shkoh 20200619: multer를 통한 저장 방법 정의
// by shkoh 20200619: destination --> 업로드한 파일의 저장 위치 지정
// by shkoh 20200619: filename --> 업로드한 파일의 저장되는 파일의 명칭 지정, 동일한 파일명을 가지고 있는 경우에 덮어 쓴다
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        try {
            fs.existsSync(image_group_dir) || fs.mkdirSync(image_group_dir);
            callback(null, image_group_dir);
        } catch(err) {
            logger.error(err);
            callback(err, image_group_dir);
        }
    },
    filename: (req, file, callback) => {
        try {
            const file_name = file.originalname.normalize('NFC');
            const old_file = path.join(image_group_dir, file_name);
            if(fs.existsSync(old_file)) {
                fs.unlinkSync(old_file);
            }
            
            callback(null, file_name);
        } catch(err) {
            logger.error(err);
            callback(err, file.originalname);
        }
    }
});

const upload = multer({ storage: storage });

module.exports = upload;