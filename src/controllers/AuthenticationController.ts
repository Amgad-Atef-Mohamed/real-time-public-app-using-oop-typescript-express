'use strict'

import { Request, Response } from 'express'
import * as Joi from 'Joi'
import BaseController from './BaseController'

/**
 * @class AuthenticationController
 * @extends BaseController
 */
export default class AuthenticationController extends BaseController {
  private authenticationService: any
  private errorManagementService: any

  constructor(otps) {
    super()

    this.authenticationService = otps.authenticationService
    this.errorManagementService = otps.errorManagementService
  }

  public applyRoutes() {
    this.router.post('/register', this.register.bind(this))

    return this.router
  }

  /**
   * register handler.
   *
   * @class AuthenticationController
   * @method register
   * @public
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @return {Promise<Response>}
   */
  public async register(req: Request, res: Response): Promise<Response> {
    try {
      // TODO validation layer.
      const schema = Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().min(3).max(60).required(),
      })

      const { error } = await schema.validate(req.body, { allowUnknown: false })

      if (error) {
        return super.render(res, 400, { message: error.details.map(i => i.message).join(',') })
      }

      await this.authenticationService.register(req.body)

      return super.render(res, 201)
    }
    catch (e) {
      console.log('err', e)
      this.errorManagementService.handle(res, e)
    }
  }
}
