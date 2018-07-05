export interface Handler<T>
{
    handle(data: T): void;
}