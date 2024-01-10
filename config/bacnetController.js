const bacnet = require('node-bacnet');

const bacnetWrite = (info) => {
    return new Promise((resolve, reject) => {
        const { ip, port, ctrl, cmd } = info;
        
        try {
            const ctrl_info = ctrl.split('.');
            let obj_type = -1;
            let obj_inst = Number(ctrl_info[1]);

            switch(ctrl_info[0]) {
                case 'BO': {
                    obj_type = bacnet.enum.ObjectType.BINARY_OUTPUT;
                    break;
                }
                case 'AO': {
                    obj_type = bacnet.enum.ObjectType.ANALOG_OUTPUT;
                    break;
                }
                case 'BLO': {
                    obj_type = bacnet.enum.ObjectType.BINARY_LIGHTING_OUTPUT;
                    break;
                }
            }

            const property_id = bacnet.enum.PropertyIdentifier.PRESENT_VALUE;
            const tag = bacnet.enum.ApplicationTag.ENUMERATED;
            const value = cmd === 'lamp-on' ? 1 : 0;
            
            const client = new bacnet({ port: port });
            client.writeProperty(ip, { type: obj_type, instance: obj_inst }, property_id, [{ type: tag, value: value }], (err, value) => {
                if(err) {
                    console.error(err);
                    reject(err.message);
                }

                resolve(value === undefined ? cmd : value);
                client.close();
            });
        } catch (err) {
            console.error(err);
            reject(err.message);
        }
    });
};

module.exports = {
    bacnetWrite
}