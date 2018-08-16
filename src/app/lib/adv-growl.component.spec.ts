
import {never as observableNever, throwError as observableThrowError, of as observableOf} from 'rxjs';
/**
 * Created by kevinkreuzer on 08.07.17.
 */
import {TestBed, inject, ComponentFixture} from '@angular/core/testing';
import {Message} from 'primeng/api';
import {GrowlModule} from 'primeng/growl';
import {AdvGrowlComponent} from './adv-growl.component';
import {AdvGrowlService} from './adv-growl.service';
import {Observable, fromEvent as observableEvent, timer as observableTimer} from 'rxjs';



import {AdvPrimeMessage} from './adv-growl.model';
import {EventEmitter, SimpleChange} from '@angular/core';

describe('Message Component', () => {

    let component: AdvGrowlComponent;
    let fixture: ComponentFixture<AdvGrowlComponent>;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [GrowlModule],
            declarations: [AdvGrowlComponent],
            providers: [AdvGrowlService]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdvGrowlComponent);
        component = fixture.componentInstance;
    });


    const createMessage = (id: string, severity: string, summary: string, detail: string): AdvPrimeMessage => (
        {id, severity, summary, detail}
    );

    describe('Setup and initialization', () => {

        it('should setup the streams and subscribe for messages on init', () => {
            // given
            spyOn(component, 'subscribeForMessages')
            // when
            component.ngOnInit()
            // then
            expect(component.subscribeForMessages)
            expect(component.hoverHelper).toBeDefined()
        })

        it('should create a mousleave stream that emits when a mouseleave event occures', () => {
            // given
            spyOn(Observable as any, 'fromEvent').and.returnValues(observableNever(), observableOf(1))
            // when
            component.ngOnInit()
            // then
  //          expect(Observable.fromEvent).toHaveBeenCalledWith(component.growlMessage.el.nativeElement, 'mouseleave')
            expect(observableEvent).toHaveBeenCalledWith(component.growlMessage.el.nativeElement, 'mouseleave')
        })
    })

    describe('Subscribe for messages', () => {

        it(`should add all arriving messages and not emit a new value which indicates that
            none of the messages should be removed`,
            inject([AdvGrowlService], (messagesService: AdvGrowlService) => {
                    // given
                    const expectedMessages: Array<AdvPrimeMessage> = [
                        createMessage('1', 'success', 'awesome message', 'awesome detail'),
                        createMessage('2', 'wanring', 'awesome message', 'awesome detail'),
                        createMessage('3', 'error', 'awesome message', 'awesome detail')
                    ];
                    const messages$ = Observable.create(observer => {
                        expectedMessages.forEach(message => {
                            observer.next(message);
                        });
                    });
                    spyOn(messagesService, 'getMessageStream')
                    spyOn(messagesService, 'getCancelStream').and.returnValue(observableNever())
                    component.messageCache = {
                        getMessages: () => {
                        }
                    } as any
                    spyOn(component.messageCache, 'getMessages').and.returnValue(messages$)

                    // when
                    component.subscribeForMessages();
                    // then
                    expect(component.messages).toEqual(expectedMessages);
                }
            ));

        it('it should call removeMessage in subscribe when a message is cleared',
            inject([AdvGrowlService], (messagesService: AdvGrowlService) => {
                // given
                const expectedMessages: Array<Message> = [
                    createMessage('1', 'success', 'awesome message', 'awesome detail'),
                    createMessage('2', 'wanring', 'awesome message', 'awesome detail'),
                    createMessage('3', 'error', 'awesome message', 'awesome detail')
                ];
                const messages$ = Observable.create(observer => {
                    expectedMessages.forEach(message => {
                        observer.next(message);
                    });
                });
                spyOn(messagesService, 'getMessageStream')
                spyOn(component, 'getLifeTimeStream').and.returnValue(observableOf(1));
                spyOn(component, 'removeMessage');
                component.messageCache = {
                    getMessages: () => {
                    },
                    deallocateMessageSpot: () => {
                    }
                } as any
                spyOn(component.messageCache, 'getMessages').and.returnValue(messages$)
                spyOn(component.messageCache, 'deallocateMessageSpot')
                // when
                component.subscribeForMessages();
                // then
                expect(component.removeMessage).toHaveBeenCalledTimes(3);
                expect(component.messageCache.deallocateMessageSpot).toHaveBeenCalledTimes(3)
            })
        );

        it(`it should call unshift in subscribe until the clearStream emits a value,
            in this case it should automatically resubscribe to the messagestream`,
            inject([AdvGrowlService], (messagesService: AdvGrowlService) => {
                // given
                let numberOfCalls = 0;
                const expectedMessages = [
                    createMessage('1', 'success', 'awesome message', 'awesome detail'),
                    createMessage('2', 'wanring', 'awesome message', 'awesome detail'),
                    createMessage('3', 'error', 'awesome message', 'awesome detail')
                ];
                const messages$ = Observable.create(observer => {
                    expectedMessages.forEach(message => {
                        observer.next(message);
                    });
                });
                spyOn(messagesService, 'getMessageStream')
                spyOn(messagesService, 'getCancelStream').and.callFake(() => {
                    if (numberOfCalls === 0) {
                        numberOfCalls++;
                        return observableOf(1);
                    }
                    return observableNever();
                });
                spyOn(component, 'getLifeTimeStream').and.returnValue(observableOf(1));
                spyOn(Array.prototype, 'shift');
                spyOn(component, 'subscribeForMessages').and.callThrough();

                component.messageCache = {
                    getMessages: () => messages$,
                    clearCache: () => {
                    },
                    deallocateMessageSpot: () => {
                    }
                } as any

                spyOn(component.messageCache, 'clearCache')
                spyOn(component.messageCache, 'deallocateMessageSpot')

                // when
                component.subscribeForMessages();
                // then
                expect(component.subscribeForMessages).toHaveBeenCalledTimes(2);
                expect(component.messageCache.clearCache).toHaveBeenCalled();
            }));

        it('should remove the message with the matching messageId', () => {
            // given
            const messageId = '1'
            const message1 = createMessage('1', 'success', 'awesome message', 'awesome detail');
            const message2 = createMessage('2', 'wanring', 'awesome message', 'awesome detail');
            const message3 = createMessage('3', 'error', 'awesome message', 'awesome detail');
            component.messages = [message1, message2, message3];
            // when
            component.removeMessage(messageId);
            // then
            expect(component.messages).toEqual([message2, message3]);
        });

        it('should not remove a message when no matching Id was found', () => {
            // given
            const messageId = '4';
            const message1 = createMessage('1', 'success', 'awesome message', 'awesome detail');
            const message2 = createMessage('2', 'wanring', 'awesome message', 'awesome detail');
            const message3 = createMessage('3', 'error', 'awesome message', 'awesome detail');
            component.messages = [message1, message2, message3];
            // when
            component.removeMessage(messageId);
            // then
            expect(component.messages).toEqual([message1, message2, message3]);
        });

        it('should throw an error when an error occures',
            inject([AdvGrowlService], (messagesService: AdvGrowlService) => {
                // given
                const errorMessage = 'Awful error';
                const messages$ = observableThrowError(new Error(errorMessage));
                spyOn(messagesService, 'getMessageStream').and.returnValue(messages$);
                component.messageCache = {
                    getMessages: () => {
                    }
                } as any
                spyOn(component.messageCache, 'getMessages').and.returnValue(messages$)
                // when then
                expect(() => component.subscribeForMessages()).toThrowError(errorMessage);
            })
        );

        it('should clear the message cache and resubscribe for messages on spot changes', () => {
            // given
            component.messageCache = {
                getMessages: () => observableOf('Some message'),
                clearCache: () => {
                }
            } as any
            spyOn(component.messageCache, 'clearCache')
            // when
            component.subscribeForMessages()
            component.messageSpotChange$.next()
            // then
            expect(component.messageCache.clearCache).toHaveBeenCalled()
        })
    })

    describe('Get Life time streams', () => {

        describe('Life time detection', () => {

            it('should have a lifeTime if the lifeTime property is bigger than the DEFAULT_LIFETIME', () => {
                // given
                const lifeTime = 2000
                // when
                const hasLifeTime = component.hasLifeTime(lifeTime)
                // then
                expect(hasLifeTime).toBeTruthy()
            })

            it('should not have a lifeTime if the lifeTime property is small or equal to the DEFAULT_LIFETIME', () => {
                // given
                const lifeTime = 0
                // when
                const hasLifeTime = component.hasLifeTime(lifeTime)
                // then
                expect(hasLifeTime).toBeFalsy()
            })
        })

        describe('Get LifeTime Stream', () => {

            it('should get an finit stream if the message has a lifetime', () => {
                // given
                const messageId = '42'
                spyOn(component, 'hasLifeTime').and.returnValue(true)
                spyOn(component, 'getFinitStream')
                // when
                component.getLifeTimeStream(messageId)
                // then
                expect(component.getFinitStream).toHaveBeenCalled()
            })

            it('should get an infinit stream if the message has no lifetime', () => {
                // given
                const messageId = '42'
                spyOn(component, 'hasLifeTime').and.returnValue(false)
                spyOn(component, 'getInifiniteStream')
                // when
                component.getLifeTimeStream(messageId)
                // then
                expect(component.getInifiniteStream).toHaveBeenCalled()
            })
        })

        describe('Get finit stream', () => {

            it('should get a pausable stream if freezeMessagesOnHover is set to true', () => {
                // given
                const messageId = '42'
                const freezeMessagesOnHover = true
                const lifeTime = 2000
                const pauseOnlyHovered = false
                component.freezeMessagesOnHover = freezeMessagesOnHover
                component.pauseOnlyHoveredMessage = pauseOnlyHovered

                component.hoverHelper = {
                    getPausableMessageStream: (param1, param2) => observableOf(1)
                } as any
                spyOn(component.hoverHelper, 'getPausableMessageStream').and.returnValue(observableOf(1))

                const asserter = {
                    next: hoveredMessageId => expect(hoveredMessageId).toBe(messageId)
                }

                // when
                const finitStream = component.getFinitStream(messageId, lifeTime)
                // then
                expect(component.hoverHelper.getPausableMessageStream).toHaveBeenCalledWith(messageId, lifeTime, pauseOnlyHovered)
                expect(finitStream.subscribe(asserter));
            })

            it('should get an unpausable stream if freezeMessagesOnHover is set to false', () => {
                // given
                const messageId = '42'
                const freezeMessagesOnHover = false
                const lifeTime = 3000;
                component.freezeMessagesOnHover = freezeMessagesOnHover
                spyOn(component, 'getUnPausableMessageStream').and.returnValue(observableOf(1))
                // when
                const finitStream = component.getFinitStream(messageId, lifeTime)
                // then
                expect(component.getUnPausableMessageStream).toHaveBeenCalledWith(lifeTime)
                expect(finitStream.subscribe(hoveredMessageId => expect(hoveredMessageId).toBe(messageId)))
            })

            it('should return a timed observable when we call getUnpausable message stream', () => {
                // given
                const lifeTime = 3000
                spyOn(Observable as any, 'timer')
                // when
                component.getUnPausableMessageStream(lifeTime)
                // then
                expect(observableTimer).toHaveBeenCalledWith(lifeTime)
            })
        })
    })

    describe('Emitting Events', () => {

        describe('Emitting Clicks', () => {
            it('should call the emitter when the event has a message', () => {
                // given
                const emitter = new EventEmitter<AdvPrimeMessage>();
                spyOn(emitter, 'next')
                const message = createMessage('1', 'succes', 'Summary', 'Super detail')
                const $event = {message}
                // when
                component.emitMessage($event, emitter)
                // then
                expect(emitter.next).toHaveBeenCalledWith(message)
            })

            it('should not call the emitter when the event does not contain a message', () => {
                // given
                const emitter = new EventEmitter<AdvPrimeMessage>();
                spyOn(emitter, 'next')
                const $event = {}
                // when
                component.emitMessage($event, emitter)
                // then
                expect(emitter.next).not.toHaveBeenCalled()
            })

            it('should call emit with the event and the onClick emitter when a message is clicked', () => {
                // given
                const $event = {message: 'Sample Message'}
                spyOn(component, 'emitMessage')
                // when
                component.messageClicked($event)
                // then
                expect(component.emitMessage).toHaveBeenCalledWith($event, component.onClick)
            })

            it('should call emit with the event and the onClose emitter when a message is closed', () => {
                // given
                component.ngOnInit()
                const $event = {message: 'Sample Message'}
                spyOn(component, 'emitMessage')
                spyOn(component.messageCache, 'deallocateMessageSpot')
                // when
                component.messageClosed($event)
                // then
                expect(component.emitMessage).toHaveBeenCalledWith($event, component.onClose)
            })

            it('must deallocate a message spot when a message is closed', () => {
                // given
                component.ngOnInit()
                const $event = {message: 'Sample Message'}
                spyOn(component.messageCache, 'deallocateMessageSpot')
                // when
                component.messageClosed($event)
                // then
                expect(component.messageCache.deallocateMessageSpot).toHaveBeenCalled()
            })
        })

        describe('Emiting hover events', () => {

            it('should extract the messageId from the event and call on next on the messageEnter subject', () => {
                // given
                const messageId = '42'
                const $event = {
                    message: {
                        id: messageId
                    }
                }
                // when
                component.messageEntered($event)
                // then
                component.messageEnter$.subscribe(enteredMesssageId => expect(enteredMesssageId).toBe(messageId))
            })
        })
    })

    describe('Create message observer', () => {

        it('should  create a messageObserver that deallocates messages spots and remove messages on next', () => {
            // given
            component.ngOnInit()
            const messageId = 12345
            spyOn(component.messageCache, 'deallocateMessageSpot')
            spyOn(component, 'removeMessage')
            // when
            const messageObserver = component.createMessageObserver()
            messageObserver.next(messageId)
            // then
            expect(component.messageCache.deallocateMessageSpot).toHaveBeenCalled()
            expect(component.removeMessage).toHaveBeenCalledWith(messageId)
        })

        it('should  create a messageObserver that calls clear cache and resubscribes on complete', () => {
            // given
            component.ngOnInit()
            spyOn(component.messageCache, 'clearCache')
            spyOn(component, 'subscribeForMessages')
            // when
            const messageObserver = component.createMessageObserver()
            messageObserver.complete()
            // then
            expect(component.messageCache.clearCache).toHaveBeenCalled()
            expect(component.subscribeForMessages).toHaveBeenCalled()
        })
    })

    describe('OnChange', () => {

        describe('Have message spots changed', () => {

            it('should return false if the currentValue is null', () => {
                // given
                const messageSpotChange = {
                    currentValue: null,
                    previousValue: 1,
                    firstChange: false
                } as SimpleChange
                // when
                const hasChanged = component.haveMessageSpotsChanged(messageSpotChange)
                // then
                expect(hasChanged).toBeFalsy()
            })

            it('should return false if the currentValue is undefined', () => {
                // given
                const messageSpotChange = {
                    currentValue: undefined,
                    previousValue: 1,
                    firstChange: false
                } as SimpleChange
                // when
                const hasChanged = component.haveMessageSpotsChanged(messageSpotChange)
                // then
                expect(hasChanged).toBeFalsy()
            })

            it('should return true if the currentValue is 0', () => {
                // given
                const messageSpotChange = {
                    currentValue: 0,
                    previousValue: 1,
                    firstChange: false
                } as SimpleChange
                // when
                const hasChanged = component.haveMessageSpotsChanged(messageSpotChange)
                // then
                expect(hasChanged).toBeTruthy()
            })

            it('should return false if it is the first change', () => {
                // given
                const messageSpotChange = {
                    currentValue: 0,
                    previousValue: 1,
                    firstChange: true
                } as SimpleChange
                // when
                const hasChanged = component.haveMessageSpotsChanged(messageSpotChange)
                // then
                expect(hasChanged).toBeFalsy()
            })

            it('should return false if it is not the first change but the value has not changed', () => {
                // given
                const messageSpotChange = {
                    currentValue: 1,
                    previousValue: 1,
                    firstChange: true
                } as SimpleChange
                // when
                const hasChanged = component.haveMessageSpotsChanged(messageSpotChange)
                // then
                expect(hasChanged).toBeFalsy()
            })
        })

        it('should stream a messageSpot change when the messageSpot has changed', done => {
            // given
            const messageSpotChange = {
                currentValue: 1,
                previousValue: 0,
                firstChange: false
            } as SimpleChange

            const changes = {
                messageSpots: messageSpotChange
            }
            // then
            component.messageSpotChange$.subscribe(() => {
                done()
            })
            // when
            component.ngOnChanges(changes)
        })
    })
})
