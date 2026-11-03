/** Every JSON answer has this shape: a message, the data (or null), and a success flag. */
export interface Envelope<T> {
    readonly message: string;
    readonly data: T;
    readonly success: boolean;
}

export const success = <T>(message: string, data: T): Envelope<T> => ({ message, data, success: true });

export const failure = (message: string): Envelope<null> => ({ message, data: null, success: false });

/** The side id sent in the "lado" header. A missing header gives NaN, which matches no side. */
export const sideIdFromHeader = (value: string | string[] | undefined): number => Number(value);
