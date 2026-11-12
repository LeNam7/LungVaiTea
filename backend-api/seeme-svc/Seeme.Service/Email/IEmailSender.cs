namespace Seeme.Service.Email;

public interface IEmailSender
{
    Task SendAsync(string email, string otp);
}


