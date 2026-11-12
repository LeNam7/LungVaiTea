namespace Seeme.Domain.Extensions;

public static class BcryptHasher
{
    public static string HashPassword(string value)
    {
        var hashed = BCrypt.Net.BCrypt.HashPassword(value, GetRandomSalt());
        return BCrypt.Net.BCrypt.HashPassword(value, GetRandomSalt());
    }

    public static bool ValidatePassword(string raw, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(raw, hash);
    }

    private static string GetRandomSalt()
    {
        return BCrypt.Net.BCrypt.GenerateSalt(12);
    }
}
