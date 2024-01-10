/**
 * kdh 20200528
 * 자산관리 > 정보관리 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/inventory/:mode 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const fs = require(`fs`);
const path = require(`path`);
const inventory_image_uploader = require(`../../config/fileUploadAssetImage`).single(`assetimage`);

const db_in_code = require(`../../database/in_code`);
const db_in_company = require(`../../database/in_company`);
const db_in_worker = require(`../../database/in_worker`);
const db_in_model = require(`../../database/in_model`);
const db_in_model_network = require(`../../database/in_model_network`);
const db_in_model_power = require(`../../database/in_model_power`);
const db_in_object = require(`../../database/in_object`);
const db_cn_equipment = require(`../../database/cn_equipment`);
const db_in_group = require(`../../database/in_group`);
const db_in_update = require(`../../database/in_update`);
const db_in_repair = require(`../../database/in_repair`);
const db_in_object_info = require(`../../database/in_object_info`);
const db_in_object_mapping = require(`../../database/in_object_mapping.js`);

router.get(`/:mode`, async (req, res, next) => {
	let results = undefined;

	switch(req.params.mode) {
		case `code`: {
			results = await db_in_code.getCodeList();
			break;
		}
		case `company`: {
			results = await db_in_company.getCompanyInfo();
			break;
		}
		case `worker`: {
			results = await db_in_worker.getWorkerInfo();
			break;
		}
		case `model`: {
			results = await db_in_model.getModelInfo();
			break;
		}
		case `model_network`: {
			let id = Number(req.query.id);
			if(isNaN(id)) {
				results = [];
			} else {
				results = await db_in_model_network.getModelNetworkInfo(id);
			}
			break;
		}
		case `model_power`: {
			let id = Number(req.query.id);
			if(isNaN(id)) {
				results = [];
			} else {
				results = await db_in_model_power.getModelPowerInfo(id);
			}
			break;
		}
		case `assets_tree`: {
			results = await db_in_object.getTree();
			break;
		}
		case `assets_list`: {
			const ids = req.query.ids;
			if(ids) {
				results = await db_in_object.getAssetsInfo(ids);
			} else {
				results = [];
			}
			break;
		}
		case `change`: {
			const ids = req.query.ids;
			if(ids) {
				results = await db_in_update.getUpdateInfo(ids);
			} else {
				results = [];
			}
			break;
		}case `repair`: {
			const ids = req.query.ids;
			if(ids) {
				results = await db_in_repair.getRepairInfo(ids);
			} else {
				results = [];
			}
			break;
		}
		case `codetype`: {
			/**
			 * by shkoh 20210217: 자산코드 타입에 따라서 코드의 리스트 제공
			 * 'W'	: worker
			 * 'NT'	: network
			 * 'NS	: network speed
			 * 'O'	: object
			 * 'R'	: work step
			 */
			const { type } = req.query;
			if(type === undefined) results = [];
			else results = await db_in_code.getCodeTypeList(type);
			break;
		}
		case `codeicon`: {
			const icon_list = [];
			fs.readdirSync(`./public/img/inventory/tree/`).forEach(file => icon_list.push({ name: file, icon: file }));
			results = icon_list;
			break;
		}
		case `assetimage`: {
			const img_list = [];
			fs.readdirSync(`./public/img/inventory/equip/`).forEach(file => img_list.push({ name: file.normalize('NFC'), path: `/img/inventory/equip/${file.normalize('NFC')}` }));
			results = img_list;
			break;
		}
	}

	if(results === undefined) {
		return next();
	} else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError') {
		return next(results);
	} else {
		return res.send(results);
	}
});

router.post(`/:mode`, async (req, res, next) => {
	let results = undefined;

	switch(req.params.mode) {
		case `company`: {
			const info = JSON.parse(req.body.info);
			let response = await db_in_company.insertCompanyInfo({
				name: info.name,
				address: info.address,
				homepage: info.homepage,
				telephone: info.telephone,
				fax: info.fax
			});

			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			results.id = response.insertId;
			break;
		}
		case `worker`: {
			const info = JSON.parse(req.body.info);
			let response = await db_in_worker.insertWorkerInfo({
				code_id: info.code_id,
				company_id: info.company_id,
				name: info.name,
				telephone: info.telephone,
				phone: info.phone,
				email: info.email
			});

			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			results.id = response.insertId;
			break;
		}
		case `model`: {
			const info = JSON.parse(req.body.info);
			let response = await db_in_model.insertModelInfo({
				name: info.name,
				company_id: info.company_id,
				rack_unit: info.rack_unit
			});
			
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			results.id = response.insertId;
			break;
		}
		case `model_network`: {
			const info = JSON.parse(req.body.info);
			let response = await db_in_model_network.insertModelNetworkInfo({
				model_id: info.model_id,
				network_type: info.network_type,
				network_speed: info.network_speed,
				network_port: info.network_port
			});
			
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			results.id = response.insertId;
			break;
		}
		case `model_power`: {
			const info = JSON.parse(req.body.info);
			let response = await db_in_model_power.insertModelPowerInfo({
				model_id: info.model_id,
				power_voltage: info.power_voltage,
				power_current: info.power_current,
				power_watt: info.power_watt,
				power_count: info.power_count
			});
			
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			results.id = response.insertId;
			break;
		}
		case `code`: {
			const info = {
				id: req.body.id,
				type: req.body.type,
				name: req.body.name === undefined ? '' : req.body.name,
				icon: req.body.icon === undefined || req.body.icon === '' ? null : req.body.icon,
				description: req.body.description === '' ? null : req.body.description
			};
			let response = await db_in_code.setInventoryCode(info);

			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
			results = info;
			break;
		}
		case `assetimage`: {
			results = await new Promise((resolve, reject) => {
				inventory_image_uploader(req, res, async (err) => {
					if(err) reject(err);
					else {
						const file_name = req.file.originalname.normalize(`NFC`);
						resolve({ msg: `자산 이미지파일 ${file_name}(size: ${Math.round(req.file.size / 1000)}KB)의 업로드를 완료했습니다` });
					}
				});
			});
			break;
		}
		case `object`: {
			const insert_info = JSON.parse(req.body.info);
			const { code_id, parent_object_id, name } = insert_info;
			
			let response = await db_in_object.insertObject({ code_id: code_id, name: name });
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
			Object.assign(insert_info, response);

			response = await db_in_group.insertObjectGroup({ object_id: insert_info.insertId, parent_object_id: parent_object_id });
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			response = await db_in_object_info.insertObjectInfo({ object_id: insert_info.insertId });
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = await db_in_object.getObjectInfo(insert_info.insertId);

			// by shkoh 20210414: 자산 | 자산관리에서 자산 추가 시, 자산 추가 내역을 기록함
			const add_info = [
				{ object_id: results.object_id, object_code_id: code_id, event_code_id: 'I0001', date: new Date(), item_name: '자산구분', item_before_data: results.object_code_name },
				{ object_id: results.object_id, object_code_id: code_id, event_code_id: 'I0001', date: new Date(), item_name: '상위 자산명', item_before_data: results.object_parent_name },
				{ object_id: results.object_id, object_code_id: code_id, event_code_id: 'I0001', date: new Date(), item_name: '자산명', item_before_data: results.object_name }
			];
			response = await db_in_update.addUpdateInfo(add_info);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
			break;
		}
		case `repair`: {
			const insert_info = req.body;
			const set = {
				object_id: insert_info.object_id,
				work_step_id: 'I3002',
				request_date: insert_info.complete_date,
				request_worker_id: insert_info.complete_worker_id,
				request_content: 'UbiGuard FMS 5.6',
				complete_date: insert_info.complete_date,
				complete_worker_id: insert_info.complete_worker_id,
				complete_content: insert_info.complete_content
			};

			let response = await db_in_repair.insertRepairInfo(set);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = Object.assign(response, insert_info);
			break;
		}
	}

	if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.patch(`/:mode`, async (req, res, next) => {
	let results = undefined;

	switch(req.params.mode) {
		case `company`: {
			const info = JSON.parse(req.body.info);
			const update_info = {
				name: info.name,
				address: info.address,
				homepage: info.homepage,
				telephone: info.telephone,
				fax: info.fax
			};
			const where = { id: info.id };
			
			let response = await db_in_company.updateCompanyInfo(update_info, where);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
			
			results = info;
			break;
		}
		case `worker`: {
			const info = JSON.parse(req.body.info);
			const update_info = {
				code_id: info.code_id,
				company_id: info.company_id,
				name: info.name,
				telephone: info.telephone,
				phone: info.phone,
				email: info.email
			};
			const where = { id: info.id };

			let response = await db_in_worker.updateWorkerInfo(update_info, where);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			break;
		}
		case `model`: {
			const info = JSON.parse(req.body.info);
			const update_info = {
				name: info.name,
				company_id: info.company_id,
				rack_unit: info.rack_unit
			};
			const where = { id: info.id };

			let response = await db_in_model.updateModelInfo(update_info, where);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			break;
		}
		case `model_network`: {
			const info = JSON.parse(req.body.info);
			const update_info = {
				network_type: info.network_type,
				network_speed: info.network_speed,
				network_port: info.network_port
			};
			const where = { id: info.id };

			let response = await db_in_model_network.updateModelNetworkInfo(update_info, where);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			break;
		}
		case `model_power`: {
			const info = JSON.parse(req.body.info);
			const update_info = {
				power_voltage: info.power_voltage,
				power_current: info.power_current,
				power_watt: info.power_watt,
				power_count: info.power_count
			};
			const where = { id: info.id };

			let response = await db_in_model_power.updateModelPowerInfo(update_info, where);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = info;
			break;
		}
		case `object`: {
			const update_info = JSON.parse(req.body.update);
			const { id, group, object, info } = update_info;

			const changed_info = [];
			const previous_object_info = await db_in_object.getObjectInfo(id);
			
			let response = undefined;
			if(group) {
				response = await db_in_group.updateObjectGroup(group, { object_id: id });
				if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

				// by shkoh 20210414: in_group과 관련된 정보 변경이 이루어졌을 경우
				changed_info.push({ object_id: id, object_code_id: previous_object_info.object_code_id, event_code_id: 'I0002', date: new Date(), item_name: '상위 자산명', item_before_data: previous_object_info.object_parent_name, item_after_data: group.parent_object_id });
			}

			if(object) {
				response = await db_in_object.updateObject(object, { id: id });
				if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

				// by shkoh 20210414: in_object와 관련된 정보 변경이 이루어졌을 경우
				Object.keys(object).forEach(function(key) {
					const _changed = { object_id: id, object_code_id: previous_object_info.object_code_id, event_code_id: 'I0002', date: new Date() };
					switch(key) {
						case 'name': {
							_changed.item_name = '자산명';
							_changed.item_before_data = previous_object_info.object_name;
							_changed.item_after_data = object[key];
							break;
						}
						case 'image': {
							_changed.item_name = '이미지';
							_changed.item_before_data = previous_object_info.object_image_name;
							_changed.item_after_data = object[key];
							break;
						}
					}

					changed_info.push(_changed);
				});
			}

			if(info) {
				response = await db_in_object_info.updateObjectInfo(info, { object_id: id });
				if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

				// by shkoh 20210414: in_object_info와 관련된 정보 변경이 이루어졌을 경우
				for(const key of Object.keys(info)) {
					const _changed = { object_id: id, object_code_id: previous_object_info.object_code_id, event_code_id: 'I0002', date: new Date() };
					switch(key) {
						case 'model_id': {
							_changed.item_name = '모델명';
							_changed.item_before_data = previous_object_info.model_name;

							const _model = await db_in_model.getModel(info[key]);
							_changed.item_after_data = _model.name;
							break;
						}
						case 'operator_id': {
							_changed.item_name = '운영 담당자';
							_changed.item_before_data = previous_object_info.operator_name;

							const _operator = await db_in_worker.getWorker(info[key]);
							_changed.item_after_data = _operator.name;
							break;
						}
						case 'manager_id': {
							_changed.item_name = '관리 담당자';
							_changed.item_before_data = previous_object_info.manager_name;

							const _manager = await db_in_worker.getWorker(info[key]);
							_changed.item_after_data = _manager.name;
							break;
						}
						case 'company_id': {
							_changed.item_name = '협력업체';
							_changed.item_before_data = previous_object_info.company_name;

							const _company = await db_in_company.getCompany(info[key]);
							_changed.item_after_data = _company.name;
							break;
						}
						case 'acquisition_date': {
							_changed.item_name = '설치일자';
							_changed.item_before_data = previous_object_info.inst_date;
							_changed.item_after_data = info[key];
							break;
						}
					}

					changed_info.push(_changed);
				}
			}

			if(changed_info.length > 0) {
				response = await db_in_update.addUpdateInfo(changed_info);
				if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
			}

			results = update_info;
			break;
		}
		case `repair`: {
			const info = req.body;
			const where = { id: info.id };
			const update_info = {
				complete_worker_id: info.complete_worker_id,
				complete_date: info.complete_date,
				complete_content: info.complete_content
			}

			const response = await db_in_repair.updateRepairInfo(update_info, where);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
			
			results = Object.assign(response, info);
			break;
		}
	}

	if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.delete(`/:mode`, async (req, res, next) => {
	let results = undefined;

	switch(req.params.mode) {
		case `company`: {
			const info = JSON.parse(req.body.info);
			const where = { id: info.id };
			results = await db_in_company.deleteCompanyInfo(where);
			break;
		}
		case `worker`: {
			const info = JSON.parse(req.body.info);
			const where = { id: info.id };
			results = await db_in_worker.deleteWorkerInfo(where);
			break;
		}
		case `model`: {
			const info = JSON.parse(req.body.info);
			const where = { id: info.id };
			results = await db_in_model.deleteModelInfo(where);
			break;
		}
		case `model_network`: {
			const info = JSON.parse(req.body.info);
			const where = { id: info.id };
			results = await db_in_model_network.deleteModelNetworkInfo(where);
			break;
		}
		case `model_power`: {
			const info = JSON.parse(req.body.info);
			const where = { id: info.id };
			results = await db_in_model_power.deleteModelPowerInfo(where);
			break;
		}
		case `code`: {
			const info = req.body;
			const where = { id: info.id };
			const response = await db_in_code.deleteInventoryCode(where);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = Object.assign(response, info);
			break;
		}
		case `assetimage`: {
			const { image_name } = req.body;

			const img_path = path.resolve(__dirname, `..`, `..`, `public`, `img`, `inventory`, `equip`, image_name);
			const is_exist = fs.existsSync(img_path);
			if(is_exist) {
				fs.unlinkSync(img_path);
				results = {
					msg: `${image_name} 파일이 삭제되었습니다\n해당 이미지파일을 참조하는 자산들은 재설정이 필요합니다`
				}
			} else {
				results = createError({
					status: 500,
					stautsText: `삭제를 위한 이미지가 존재하지 않습니다`
				});
			}
			break;
		}
		case `object`: {
			const info = JSON.parse(req.body.delete);
			const previous_object_info = await db_in_object.getObjectInfo(info.id);
			
			// by shkoh 20210412: 자산에서 object 삭제는 3개의 테이블에 영향을 받는다
			// by shkoh 20210412: in_object / in_object_info / in_group
			let response = undefined;
			response = await db_in_group.updateObjectGroup({ b_delete: 1 }, { object_id: info.id });
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			response = await db_in_object.updateObject({ b_delete: 1 }, { id: info.id });
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			response = await db_in_object_info.updateObjectInfo({ b_delete: 1 }, { object_id: info.id });
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			// by shkoh 20210414: in_object의 정보가 삭제가 됐을 경우
			response = await db_in_update.addUpdateInfo([{ object_id: info.id, object_code_id: previous_object_info.object_code_id, event_code_id: 'I0003', date: new Date() }]);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = Object.assign(response, { delete_id: info.id });
			break;
		}
		case `repair`: {
			const info = req.body;
			const where = { id: info.id };
			const response = await db_in_repair.deleteRepairInfo(where);
			if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

			results = Object.assign(response, info);
			break;
		}
	}

	if(results === undefined) {
		return next();
	} else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
		return next(results);
	} else {
		return res.send(results);
	}
});

module.exports = router;