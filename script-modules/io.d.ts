export function copy_dir(source: string, dest: string): boolean;

export function create_dir(dir: string): boolean;

export function dir_exist(dir: string): boolean;

export function file_exist(file: string): boolean;

export function read_dir(dir: string, filter?: 'files' | 'dirs' | 'normal' | 'all'): string[] | undefined;

export function read_file(file: string, max?: number): string;

export function read_file_lines(file: string, ignore_comments?: boolean): string[] | undefined;

export function remove_dir(dir: string): boolean;

export function remove_file(file: string): boolean;

export function write_file(file: string, str: string): void;
