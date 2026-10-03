import PartnerJoinForm from './PartnerJoinForm';
export const metadata={title:'Partner onboarding | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function PartnerJoin({params}:{params:Promise<{token:string}>}){const{token}=await params;return <main className="join-page"><PartnerJoinForm token={token}/></main>}
