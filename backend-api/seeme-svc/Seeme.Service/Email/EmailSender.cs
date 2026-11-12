using System.Net;
using System.Net.Mail;
using Seeme.Domain.Models.Auth;
using Microsoft.Extensions.Options;

namespace Seeme.Service.Email;

public class EmailSender : IEmailSender
{
    private readonly EmailSettings _settings;

    public EmailSender(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public async Task SendAsync(string email, string otp)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpServer))
        {
            // Email is not configured; silently skip sending in this environment
            return;
        }

        using var smtpClient = new SmtpClient(_settings.SmtpServer, _settings.SmtpPort)
        {
            EnableSsl = _settings.EnableSsl,
            Credentials = new NetworkCredential(_settings.UserName, _settings.Password),
        };

        var fromAddress = new MailAddress(
            string.IsNullOrWhiteSpace(_settings.FromAddress)
                ? _settings.UserName
                : _settings.FromAddress,
            _settings.FromName
        );
        var toAddress = new MailAddress(email);
        
        string contentEmail = string.Format(@"
            <table style=""vertical-align:top"" role=""presentation"" border=""0"" width=""100%"" cellspacing=""0"" cellpadding=""0"">
                <tbody>
                    <tr>
                        <td style=""font-size:0px;padding:5px 5px 10px 5px;word-break:break-word"" align=""left"">
                            <div style=""font-family:BinancePlex,Arial,PingFangSC-Regular,'Microsoft YaHei',sans-serif;font-size:20px;font-weight:900;line-height:25px;text-align:left;color:#000000"">[Quản lý thiết bị] Mã xác minh</div>
                        </td>
                    </tr>
                    <tr>
                        <td style=""font-size:0px;padding:5px 5px 5px 5px;word-break:break-word"" align=""left"">
                            <div style=""font-family:BinancePlex,Arial,PingFangSC-Regular,'Microsoft YaHei',sans-serif;font-size:14px;line-height:20px;text-align:left;color:#000000"">Mã OTP để đặt lại mật khẩu của bạn là: </div>
                        </td>
                    </tr>
                    <tr>
                        <td style=""background:#ffffff;font-size:0px;padding:5px 5px 5px 5px;word-break:break-word"" align=""left"">
                            <div style=""font-family:BinancePlex,Arial,PingFangSC-Regular,'Microsoft YaHei',sans-serif;font-size:18px;line-height:30px;text-align:left;color:#f0b90b"">
                                <div><span><strong>{0}</strong></span></div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style=""font-size:0px;padding:5px 5px 5px 5px;word-break:break-word"" align=""left"">
                            <div style=""font-family:BinancePlex,Arial,PingFangSC-Regular,'Microsoft YaHei',sans-serif;font-size:14px;line-height:20px;text-align:left;color:#000000"">
                                <span>Mã xác minh sẽ có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với người khác.</span>
                                <div>&nbsp;</div>
                                <div><em>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. </em></div>
                                <div>&nbsp;</div>
                                <div><em>Đây là tin nhắn tự động, vui lòng không trả lời. </em></div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        ", otp);

        using var message = new MailMessage(fromAddress, toAddress)
        {
            Subject = "Xác minh khôi phục mật khẩu Quản lý thiết bị",
            Body = contentEmail,
            IsBodyHtml = true,
        };

        await smtpClient.SendMailAsync(message);
    }
}


