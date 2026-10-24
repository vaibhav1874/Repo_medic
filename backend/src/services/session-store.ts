import { Session } from '../schemas/session.schema.js';

class SessionStore {
  private sessions = new Map<string, Session>();
  private sessionWorkspaces = new Map<string, string>(); // sessionId -> tempWorkspacePath

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  set(session: Session): void {
    session.updatedAt = new Date().toISOString();
    this.sessions.set(session.id, session);
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  list(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  setWorkspace(sessionId: string, workspacePath: string): void {
    this.sessionWorkspaces.set(sessionId, workspacePath);
  }

  getWorkspace(sessionId: string): string | undefined {
    return this.sessionWorkspaces.get(sessionId);
  }
}

export const sessionStore = new SessionStore();
