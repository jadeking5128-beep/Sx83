import Link from "next/link";
import CommunityPage from "./community/page";

export default function Home() {
  return <>
    <CommunityPage />
    <nav aria-label="Institutional sections" style={{position:"fixed",right:18,top:76,zIndex:80,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"min(560px,calc(100vw - 30px))"}}>
      {[
        ["BULLETIN","/bulletin"],["REGISTRY","/members"],["ARCHIVES","/archives"],["ADMINISTRATION","/administration"]
      ].map(([label,href])=><Link key={href} href={href} style={{padding:"8px 10px",border:"1px solid rgba(199,166,106,.35)",background:"rgba(12,15,16,.94)",color:"#d8c99e",font:"8px ui-monospace,monospace",letterSpacing:".7px",textDecoration:"none",backdropFilter:"blur(12px)"}}>{label}</Link>)}
    </nav>
  </>;
}
