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

export function apply_profile(profile: string): null | undefined;

export function change_list(path: string): ChangeList;

export function expand_path(path: string): string | undefined;

export function keypress(key: string): null | undefined

export function loadfile(file: string, mode?: 'replace' | 'append' | 'append-play', options?: {[key: string]: unknown}): null | undefined

export function restore_profile(profile: string): null | undefined;
