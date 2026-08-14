import { Injectable } from '@nestjs/common';
import { IdentitiesRepository } from './identities.repository';
import { IdentityInput } from 'src/common/types';

@Injectable()
export class IdentitiesService {
  constructor(private identitiesRepository: IdentitiesRepository) {}

  async createIdentity(identityInput: IdentityInput) {
    await this.identitiesRepository.createIdentity(identityInput);
  }

  async findIdentityByProviderAndProviderId(
    providerUserId: string,
    provider: string,
  ) {
    const foundIdentity =
      await this.identitiesRepository.findIdentityByProviderAndProviderId(
        providerUserId,
        provider,
      );
    return foundIdentity;
  }
}
