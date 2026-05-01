import Database from 'better-sqlite3';
import { SecurityFence } from '../security/fence';
import { AuditService } from '../security/audit';
import { PolicyManager } from '../security/policy';

export class SecurityService {
  fence: SecurityFence;
  audit: AuditService;
  policy: PolicyManager;

  constructor(private db: Database.Database) {
    this.fence = new SecurityFence(db);
    this.audit = new AuditService(db);
    this.policy = new PolicyManager(db);
  }
}
