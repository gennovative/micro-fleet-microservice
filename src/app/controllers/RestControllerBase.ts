import * as express from 'express';
import { decorate } from 'inversify';
import TrailsApp = require('trails');
import TrailsController = require('trails-controller');

import { injectable, inject, Guard } from 'back-lib-common-util';
import { SettingItem, SettingItemDataType, ISoftDelRepository,
	ModelAutoMapper, JoiModelValidator } from 'back-lib-common-contracts';
import { IdProvider, Types } from 'back-lib-id-generator';


decorate(injectable(), TrailsController);

@injectable()
export abstract class RestControllerBase<TModel extends IModelDTO> extends TrailsController {

	constructor(
		trailsApp: TrailsApp,
		protected _ClassDTO?: { new(): TModel },
		protected _repo?: ISoftDelRepository<TModel, any, any>,
		protected _idProvider?: IdProvider
	) {
		super(trailsApp);
	}

	protected get validator(): JoiModelValidator<TModel> {
		return this._ClassDTO['validator'];
	}

	protected get translator(): ModelAutoMapper<TModel> {
		return this._ClassDTO['translator'];
	}


	public async countAll(req: express.Request, res: express.Response) {
		console.log('Counting model');
		let payload = req.body();
		try {
			let nRows: number = await this._repo.countAll(payload.options);
			this.reply(nRows, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}

	public async create(req: express.Request, res: express.Response) {
		console.log('Creating model');
		let payload = req.body(),
			dto: TModel = this.translator.whole(payload.model, {
				errorCallback: err => this.validationError(err, res)
			});
		if (!dto) { return; }

		try {
			dto = await this._repo.create(dto, payload.options);
			this.reply(dto, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}

	public async deleteHard(req: express.Request, res: express.Response) {
		console.log('Hard deleting model');
		let payload = req.body(),
			[err, pk] = this.validator.pk(payload.pk);
		if (!err) {
			this.validationError(err, res);
			return;
		}

		try {
			let nRows: number = await this._repo.deleteHard(pk, payload.options);
			this.reply(nRows, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}

	public async deleteSoft(req: express.Request, res: express.Response) {
		console.log('Soft deleting model');
		let payload = req.body(),
			[err, pk] = this.validator.pk(payload.pk);
		if (!err) {
			this.validationError(err, res);
			return;
		}

		try {
			let nRows: number = await this._repo.deleteSoft(pk, payload.options);
			this.reply(nRows, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}

	public async exists(req: express.Request, res: express.Response) {
		console.log('Checking existence');
		let payload = req.body();
		try {
			let gotIt: boolean = await this._repo.exists(payload.props, payload.options);
			this.reply(gotIt, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}

	public async findByPk(req: express.Request, res: express.Response) {
		console.log('Finding model');
		let payload = req.body(),
			[err, pk] = this.validator.pk(payload.pk);
		if (!err) {
			this.validationError(err, res);
			return;
		}

		try {
			let dto: TModel = await this._repo.findByPk(pk, payload.options);
			this.reply(dto, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}

	public async recover(req: express.Request, res: express.Response) {
		console.log('Recovering model');
		let payload = req.body(),
			[err, pk] = this.validator.pk(payload.pk);
		if (!err) {
			this.validationError(err, res);
			return;
		}

		try {
			let nRows: number = await this._repo.recover(pk, payload.options);
			this.reply(nRows, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}

	public async patch(req: express.Request, res: express.Response) {
		console.log('Patching model');
		let payload = req.body(),
			model = this.translator.partial(payload.model, {
				errorCallback: err => this.validationError(err, res)
			});
		if (!model) { return; }

		try {
			let updatedProps: Partial<TModel> = await this._repo.patch(model, payload.options);
			this.reply(updatedProps, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}

	public async update(req: express.Request, res: express.Response) {
		console.log('Updating model');
		let payload = req.body(),
			model: TModel = this.translator.whole(payload.model, {
				errorCallback: err => this.validationError(err, res)
			});
		if (!model) { return; }

		try {
			let updatedModel: TModel = await this._repo.update(model, payload.options);
			this.reply(updatedModel, res);
		} catch (err) {
			this.internalError(err, res);
		}
	}


	protected validationError(err, res: express.Response): void {
		super.log.error(err);
		res.status(412).send(err); // Precondition Failed
	}

	protected internalError(err, res: express.Response): void {
		super.log.error(err);
		res.status(500).send('server.error.internal');
	}

	protected reply(result, res: express.Response): void {
		res.status(200).send(result);
	}
}