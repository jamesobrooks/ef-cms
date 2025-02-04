import { JoiValidationEntity } from './JoiValidationEntity';
import { ROLES } from './EntityConstants';
import { User } from './User';

/**
 * constructor
 *
 * @param {object} rawUser the raw user data
 * @constructor
 */
export class PublicUser extends JoiValidationEntity {
  public name: string;
  public role: string;
  public judgeFullName: string;
  public judgeTitle: string;

  constructor(rawUser) {
    super('PublicUser');
    this.name = rawUser.name;
    this.role = rawUser.role;
    if (this.role === ROLES.judge || this.role === ROLES.legacyJudge) {
      this.judgeFullName = rawUser.judgeFullName;
      this.judgeTitle = rawUser.judgeTitle;
    }
  }

  getErrorToMessageMap() {
    return {
      role: 'Role is required',
    } as any;
  }

  getValidationRules() {
    return User.BASE_USER_VALIDATION as any;
  }
}
