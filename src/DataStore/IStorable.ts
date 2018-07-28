export interface IStorable
{
    get<T>(name: string): T;
    set(name: string, value: any): void;
}