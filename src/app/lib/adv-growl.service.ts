/**
 * Copyright (C) Schweizerische Bundesbahnen SBB, 2017.
 *
 * ESTA WebJS: Message Servcice
 *
 * @author u218609 (Kevin Kreuzer)
 * @version: 2.0.0
 * @since 28.04.2017, 2017.
 */
import {Observable, Subject} from 'rxjs';
import {Injectable} from '@angular/core';
import {AdvPrimeMessage} from './adv-growl.model';

const MessageSeverities = {
    SUCCESS: 'success',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

@Injectable()
export class AdvGrowlService {

    private message$: Subject<AdvPrimeMessage> = new Subject<AdvPrimeMessage>();
    private cancel$: Subject<any> = new Subject<any>();
    private readonly USE_DEFAULT_LIFETIME = undefined;

    constructor() {
    }

    public createSuccessMessage(messageContent: string, summary: string, additionalProperties?: any): void {
        this.createMessage(MessageSeverities.SUCCESS, summary, messageContent, this.USE_DEFAULT_LIFETIME, additionalProperties);
    }

    public createTimedSuccessMessage(messageContent: string, summary: string, lifeTime: number, additionalProperties?: any): void {
        this.createMessage(MessageSeverities.SUCCESS, summary, messageContent, lifeTime, additionalProperties);
    }

    public createInfoMessage(messageContent: string, summary: string, additionalProperties?: any): void {
        this.createMessage(MessageSeverities.INFO, summary, messageContent, this.USE_DEFAULT_LIFETIME, additionalProperties);
    }

    public createTimedInfoMessage(messageContent: string, summary: string, lifeTime: number, additionalProperties?: any): void {
        this.createMessage(MessageSeverities.INFO, summary, messageContent, lifeTime, additionalProperties);
    }

    public createWarningMessage(messageContent: string, summary: string, additionalProperties?: any): void {
        this.createMessage(MessageSeverities.WARN, summary, messageContent, this.USE_DEFAULT_LIFETIME, additionalProperties);
    }

    public createTimedWarningMessage(messageContent: string, summary: string, lifeTime: number, additionalProperties?: any): void {
        this.createMessage(MessageSeverities.WARN, summary, messageContent, lifeTime, additionalProperties);
    }

    public createErrorMessage(messageContent: string, summary: string, additionalProperties?: any): void {
        this.createMessage(MessageSeverities.ERROR, summary, messageContent, this.USE_DEFAULT_LIFETIME, additionalProperties);
    }

    public createTimedErrorMessage(messageContent: string, summary: string, lifeTime: number, additionalProperties?: any): void {
        this.createMessage(MessageSeverities.ERROR, summary, messageContent, lifeTime, additionalProperties);
    }

    private createMessage(severity: string, summary: string, detail: string, lifeTime?: number, additionalProperties?: any): void {
        this.message$.next({id: this.getTimeStamp(), severity, summary, detail, lifeTime, additionalProperties});
    }

    private getTimeStamp(): string {
        return new Date().getTime() + ''
    }

    public clearMessages(): void {
        this.cancel$.next();
    }

    public getMessageStream(): Observable<AdvPrimeMessage> {
        return this.message$.asObservable();
    }

    public getCancelStream(): Observable<boolean> {
        return this.cancel$.asObservable();
    }
}
