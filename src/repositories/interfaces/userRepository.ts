'use strict'

import User from './../../models/interfaces/user'

export interface UersRepositoryInterface {
  countByEmail(email: string): Promise<number>

  createNewAccount(name: string, email: string): Promise<User>

  setTheNewPasswordByEmail(email: string, hashedPassword: string): Promise<void>

  findByEmail(email: string): Promise<User>

  findById(userId: string): Promise<User>
}

export default UersRepositoryInterface
