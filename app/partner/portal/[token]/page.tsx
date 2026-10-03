import PartnerPortal from './PartnerPortal';
export const dynamic='force-dynamic';
export const metadata={title:'Private partner dashboard | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function PartnerPortalPage({params}:{params:Promise<{token:string}>}){const{token}=await params;return <PartnerPortal token={token}/>}
