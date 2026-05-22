import { Injectable, inject } from '@angular/core';
import { ELEMENT_SERIALIZER_TOKEN, SerializerContext } from '../tokens/element-serializer.token';
import { TIPTAP_EXTENSIONS_TOKEN } from '../tokens/tiptap-extensions.token';
import { IMAGE_RESOLVER_TOKEN } from '../tokens/image-resolver.token';
import { CanvasData } from '../models/canvas-data.model';
import { PublishPayload } from '../models/publish-payload.model';
import { serializeCanvas, toHtmlDocument } from './canvas-serializer';

@Injectable()
export class CanvasSerializer {
  private readonly serializers = inject(ELEMENT_SERIALIZER_TOKEN);
  private readonly tiptapExtensions = inject(TIPTAP_EXTENSIONS_TOKEN);
  private readonly imageResolver = inject(IMAGE_RESOLVER_TOKEN);

  serialize(data: CanvasData): PublishPayload {
    const ctx: SerializerContext = {
      tiptapExtensions: this.tiptapExtensions,
      resolveImage: this.imageResolver,
    };

    const { html, css, js, head } = serializeCanvas(data, this.serializers, ctx);
    const fullDocument = toHtmlDocument({ html, css, js, head }, data.meta);

    return {
      canvasData: data,
      html,
      css,
      js,
      fullDocument,
      meta: data.meta,
    };
  }
}
