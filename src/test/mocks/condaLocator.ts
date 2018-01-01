import { injectable } from 'inversify';
import { Uri } from 'vscode';
import { ICondaLocatorService } from '../../client/interpreter/contracts';

@injectable()
export class MockCondaLocator implements ICondaLocatorService {
    constructor(private condaFile: string = 'conda', private available: boolean = true, private version: string = '1') { }
    public async getCondaFile(resource?: Uri): Promise<string> {
        return this.condaFile;
    }
    public async isCondaAvailable(resource?: Uri): Promise<boolean> {
        return this.available;
    }
    public async getCondaVersion(resource?: Uri): Promise<string | string> {
        return this.version;
    }
}
