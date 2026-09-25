import { NextRequest, NextResponse } from "next/server";
import { failure, success } from "@/lib/api-contract";
import { NotionConfigurationError, queryActive } from "@/lib/server/notion-read";
import { deriveMedia, normalizeMediaTypes, normalizeMode } from "@/lib/widget-data/media";
export const dynamic="force-dynamic";

const headers={"Cache-Control":"private, no-store"};

export async function GET(request:NextRequest){
  try {
    const params=request.nextUrl.searchParams;
    const modes=normalizeMode(params.get("mode"));
    const mediaTypes=normalizeMediaTypes(params.getAll("mediaType"));
    const rawFavorite=params.get("favorite");
    if(!modes||!mediaTypes||(rawFavorite!==null&&rawFavorite!=="true"&&rawFavorite!=="false")){
      return NextResponse.json(failure("INVALID_FILTER","Use an approved mode, mediaType, and optional true/false favorite filter.","system"),{status:400,headers});
    }
    const favorite=rawFavorite==="true"?true:rawFavorite==="false"?false:null;
    const items=deriveMedia(await queryActive("P11"),{modes,mediaTypes,favorite}).map(item=>({id:item.id,title:item.title,mediaType:item.mediaType,platform:item.platform,url:item.url,mode:item.mode,purpose:item.purpose,duration:item.duration,relatedContext:item.relatedContext,provider:item.provider,embedUrl:item.embedUrl}));
    return NextResponse.json(success({items,filters:{modes,mediaTypes,favorite}},"notion"),{headers});
  } catch(error) {
    const body=error instanceof NotionConfigurationError
      ?failure("NOT_CONFIGURED",error.message,"notion")
      :failure("UPSTREAM_UNAVAILABLE","P11 Media Library is temporarily unavailable.","notion");
    return NextResponse.json(body,{headers});
  }
}
