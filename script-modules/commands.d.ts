interface ChangeList {
    readonly name: string;

    add(items: any[]): null | undefined;

    append(item: any): null | undefined;

    clr(): null | undefined;

    pre(items: any[]): null | undefined;

    remove(item: any): null | undefined;

    set(items: any[]): null | undefined;

    toggle(item: any): null | undefined;
}

interface SubprocessResult {
    status: number;
    stdout: string;
    stderr: string;
    error_string: string;
    killed_by_us: boolean;
}

interface AsyncCommandResult {
    abort(): void;
}

type AddCommandFlags = 'select' | 'auto' | 'cached';

type AsyncCommandCallback<T> = (success: boolean, result: T | undefined, error: string | undefined) => void;

export function audio_add(url: string, flags?: AddCommandFlags, title?: string, lang?: string): null | undefined;

export function apply_profile(profile: string): null | undefined;

export function change_list(name: string): ChangeList;

export function expand_path(path: string): string | undefined;

export function keypress(key: string): null | undefined;

export function loadfile(file: string, flags?: 'replace' | 'append' | 'append-play'): null | undefined;

export function restore_profile(profile: string): null | undefined;

export function subprocess(args: string[], options?: object): Readonly<SubprocessResult> | undefined;

export function subprocess_async(args: string[], callback?: AsyncCommandCallback<Readonly<SubprocessResult>>): AsyncCommandResult;

export function subprocess_async(args: string[], options?: object, callback?: AsyncCommandCallback<Readonly<SubprocessResult>>): AsyncCommandResult;
