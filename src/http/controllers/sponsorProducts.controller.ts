import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Path,
    Post,
    Route,
    Security,
    Tags,
} from 'tsoa';

import { Permission } from '../../domain/auth/permissions';
import {
    createSponsorProduct,
    deleteSponsorProduct,
    getSponsorProductById,
    listSponsorProducts,
    updateSponsorProduct,
} from '../../domain/sponsors/sponsor.service';
import {
    sponsorProductCreateSchema,
    sponsorProductIdParamsSchema,
    sponsorProductUpdateSchema,
} from '../schemas/sponsor.schemas';
import {
    toSponsorProductDTO,
    type CreateSponsorProductBodyDTO,
    type SponsorProductDTO,
    type UpdateSponsorProductBodyDTO,
} from '../dto/sponsor.dto';
import type { OkDTO } from '../dto/common.dto';

@Route('sponsor-products')
@Tags('Sponsor Products')
@Security('cookieAuth', [Permission.SPONSORS_MANAGE])
export class SponsorProductsController extends Controller {
    @Get()
    public async list(): Promise<SponsorProductDTO[]> {
        const products = await listSponsorProducts({ includeInactive: true });
        return products.map(toSponsorProductDTO);
    }

    @Get('{id}')
    public async get(@Path() id: string): Promise<SponsorProductDTO> {
        const params = sponsorProductIdParamsSchema.parse({ id });
        return toSponsorProductDTO(await getSponsorProductById(params.id));
    }

    @Post()
    public async create(
        @Body() body: CreateSponsorProductBodyDTO,
    ): Promise<SponsorProductDTO> {
        const data = sponsorProductCreateSchema.parse(body);
        return toSponsorProductDTO(await createSponsorProduct(data));
    }

    @Patch('{id}')
    public async update(
        @Path() id: string,
        @Body() body: UpdateSponsorProductBodyDTO,
    ): Promise<SponsorProductDTO> {
        const params = sponsorProductIdParamsSchema.parse({ id });
        const data = sponsorProductUpdateSchema.parse(body);
        return toSponsorProductDTO(
            await updateSponsorProduct(params.id, data),
        );
    }

    @Delete('{id}')
    public async delete(@Path() id: string): Promise<OkDTO> {
        const params = sponsorProductIdParamsSchema.parse({ id });
        await deleteSponsorProduct(params.id);
        return { status: 'ok' };
    }
}
