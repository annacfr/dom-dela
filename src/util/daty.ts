const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const segodnya = () => localDate(new Date());
export const sdvig = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return localDate(d); };
export const tekushchiySrok = () => `${segodnya()}T${new Date().toTimeString().slice(0, 5)}`;
export const formatDaty = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
export const formatVremeni = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
export const id = () => crypto.randomUUID();
