/** One legal move of the AI side, with what the choice rules need to know about it. */
export interface AiOption {
    readonly from: string;
    readonly to: string;
    readonly moveName: string | null;
    readonly pieceType: string;
    /** The opponent can capture the piece where it stands now. */
    readonly isThreatened: boolean;
    /** The target square can be captured by the opponent. */
    readonly isCapturable: boolean;
    readonly isCapture: boolean;
    /** Distance from the origin square to the opponent's king. */
    readonly distanceFrom: number;
    /** Distance from the target square to the opponent's king. */
    readonly distanceTo: number;
}

/**
 * Keeps the options that pass each rule in turn. A rule that would leave nothing is skipped.
 * Order: save threatened pieces, avoid capturable squares, prefer captures, approach the king (or move pawns).
 */
export const narrowAiOptions = (options: readonly AiOption[]): AiOption[] => {
    const rules: ((option: AiOption) => boolean)[] = [
        (option) => option.isThreatened,
        (option) => !option.isCapturable,
        (option) => option.isCapture,
        (option) => option.distanceFrom > option.distanceTo || option.pieceType === PAWN,
    ];

    return rules.reduce((current, rule) => {
        const narrowed = current.filter(rule);
        return narrowed.length !== 0 ? narrowed : current;
    }, [...options]);
};

/** Picks one of the remaining options at random. Undefined when there are none. */
export const chooseAiMove = (options: readonly AiOption[], random: () => number = Math.random): AiOption | undefined => {
    const narrowed = narrowAiOptions(options);
    return narrowed[Math.floor(random() * narrowed.length)];
};

/** Pawn name in the lookup data. */
const PAWN = "Peão"; // names-check:ignore (data value)

/** Steps between two squares, counting files and ranks as the AI always has. */
export const squareDistance = (a: string, b: string): number => {
    const fileOf = (name: string) => name.charCodeAt(0) - 64;
    const rankOf = (name: string) => Number(name[1]);
    return Math.abs(fileOf(a) - fileOf(b)) + Math.abs(rankOf(a) - rankOf(b));
};
