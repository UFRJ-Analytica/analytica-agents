export interface Message {
    manager: string,
    date: string | Date,
    text: string
}

export type Messages = Message[];
