import { NextResponse } from "next/server";
import { createActionSession } from "@/lib/server/action-security";

export const dynamic="force-dynamic";
export async function GET(){
  try{
    const session=createActionSession();
    const response=NextResponse.json({ok:true,csrfToken:session.token,expiresAt:session.expiresAt},{headers:{"Cache-Control":"private, no-store"}});
    response.cookies.set(session.cookieName,session.cookieValue,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/api/actions",maxAge:session.maxAge});
    return response;
  }catch{return NextResponse.json({ok:false,errorCode:"UPSTREAM_UNAVAILABLE"},{status:503,headers:{"Cache-Control":"private, no-store"}})}
}
