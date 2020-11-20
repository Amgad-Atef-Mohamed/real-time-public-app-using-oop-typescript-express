'use strict'

import * as bcrypt from 'bcrypt'
import * as config from 'config'

import userRepository from './../repositories/interfaces/userRepository'
import BadError from './../utilities/errors/BadError'

import  Cache from '../services/interfaces/Cache'
import Mailing from '../services/interfaces/Mailing'

export default class AuthService {
  private userRepository: userRepository
  private CacheAdapter: Cache
  private mailingAdapter: Mailing

  constructor(opts) {
    this.userRepository = opts.userRepository
    this.CacheAdapter = opts.CacheAdapter
    this.mailingAdapter = opts.mailingAdapter
  }

  public async register(payload): Promise<void> {
    const { name, email } = payload

    const numberOfUsersHaveTheEmail: number = await this.userRepository.countByEmail(email)

    if (numberOfUsersHaveTheEmail) {
      throw new BadError('Email Already Exist')
    }

    await this.userRepository.createNewAccount(name, email)

    return this.sendOTPMailToResetHisPassword(email)
  }

  public async sendOTPMailToResetHisPassword(email): Promise<void> {
    const keys: string[] = await this.CacheAdapter.searchByPattern(`${email}_OTP*`)

    if (keys.length > 0) {
      throw new BadError('Code already sent. Wait 2 minutes before resend')
    }

    const OTP: string = this.generateOTP()
    const cacheKey: string = `${email}_OTP`

    await this.mailingAdapter.sendOTPMail(email, OTP)

    return this.CacheAdapter.set(cacheKey, OTP, config.get('TTL_FOR_OTP'))
  }

  private generateOTP(): string {
    return (Math.floor(Math.random() * ((10 * 1000) - 1000)) + 1000).toString()
  }

  public async setNewPassword({ email, password, OTP }): Promise<any[]> {
    const cacheKey: string = `${email}_OTP`
    const OTPExistOnCache: string = await this.CacheAdapter.getByPattern(cacheKey)

    if (OTPExistOnCache !== OTP) {
      throw new BadError('Security Code Wrong')
    }

    const salt: string = await bcrypt.genSalt(10)
    const hashedPassword: string = await bcrypt.hash(password, salt)

    return Promise.all([
      this.userRepository.setTheNewPasswordByEmail(email, hashedPassword),
      this.CacheAdapter.delByPattern(cacheKey),
    ])
  }
}
