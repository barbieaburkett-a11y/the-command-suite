'use client';

export default function PrintDrafts({label='Print / save internal drafts'}:{label?:string}){return <button className="print-drafts" type="button" onClick={()=>window.print()}>{label}</button>}
