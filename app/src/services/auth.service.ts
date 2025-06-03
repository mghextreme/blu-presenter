import { IAuthInvitationData, IAuthResponse, IChangePasswordData, IExchangeCodeData, IOAuthRedirect, ISignInData, ISignUpData } from "@/types/auth";
import { ApiService } from "./api.service";
import { useAuth } from "@/hooks/useAuth";
import { QueryClient } from "@tanstack/react-query";
import { OrganizationsService } from "./organizations.service";

export class AuthService extends ApiService {

  constructor(
    queryClient: QueryClient,
    config: { url: string },
    private readonly organizationsService: OrganizationsService,
  ) {
    super(queryClient, config);
  }

  public async signIn(value: ISignInData): Promise<void> {
    const {
      user, session, inviteOrgId
    } = await this.postRequest('/auth/signIn', JSON.stringify(value), {
      'content-type': 'application/json',
    }, false) as IAuthResponse;

    useAuth.setState({
      isLoggedIn: true,
      user,
      session,
    });

    this.queryClient.clear();
    await this.getAndSetOrganizations(inviteOrgId);
  }

  public async signInWithProvider(provider: string, invite?: IAuthInvitationData): Promise<IOAuthRedirect> {
    let body: string | undefined = undefined;

    if (invite && invite.id && invite.secret) {
      body = JSON.stringify({
        invite,
      });
    }

    return await this.postRequest(`/auth/sso/${provider}`, body, {
      'content-type': 'application/json',
    }, false) as IOAuthRedirect;
  }

  public async signUp(value: ISignUpData): Promise<void> {
    const {
      user, session, inviteOrgId
    } = await this.postRequest('/auth/signUp', JSON.stringify(value), {
      'content-type': 'application/json',
    }, false) as IAuthResponse;

    useAuth.setState({
      isLoggedIn: true,
      user,
      session,
    });

    this.queryClient.clear();
    await this.getAndSetOrganizations(inviteOrgId);
  }

  public async changePassword(value: IChangePasswordData): Promise<void> {
    await this.postRequest('/auth/changePassword', JSON.stringify(value), {
      'content-type': 'application/json',
    });
  }

  public async exchangeCodeForSession(data: IExchangeCodeData): Promise<void> {
    const { user, session, inviteOrgId } = await this.postRequest('/auth/validate', JSON.stringify(data), {
      'content-type': 'application/json',
    }, false) as IAuthResponse;

    useAuth.setState({
      isLoggedIn: true,
      user,
      session,
    });
    
    this.queryClient.clear();
    await this.getAndSetOrganizations(inviteOrgId);
  }

  public async signOut(): Promise<void> {
    this.queryClient.clear();
  }

  public async refreshOrganizations(): Promise<void> {
    await this.getAndSetOrganizations();
  }

  public async getAndSetOrganizations(inviteOrgId?: number) {
    const orgs = await this.organizationsService.getFromUser();

    useAuth.setState({
      organizations: orgs,
    });

    setTimeout(() => {
      useAuth.getState().setOrganizationById(inviteOrgId);
    }, 100);
  }

}
