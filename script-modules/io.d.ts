export function copy_dir(source: string, dest: string): boolean;

export function create_dir(dir: string): boolean;

export function dir_exist(dir: string): boolean;

export function file_exist(file: string): boolean;

export function read_file_lines(file: string, ignore_comments: boolean = true): string[] | undefined;

export function remove_dir(dir: string): boolean;
