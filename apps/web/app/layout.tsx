import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'CitySense · Explorez Montbéliard',description:'Exploration urbaine et mobilité accessible à Montbéliard.'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="fr"><body>{children}</body></html>;}
