export interface Storable
{
    get<T>(name: string): T;
    set(name: string, value: any): void;
}