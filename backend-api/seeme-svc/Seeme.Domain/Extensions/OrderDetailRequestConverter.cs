using Seeme.Domain.Models.Order;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Seeme.Domain.Extensions
{
    public class OrderDetailRequestConverter : JsonConverter<OrderDetailRequest>
    {
        public override OrderDetailRequest Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            using var doc = JsonDocument.ParseValue(ref reader);
            var root = doc.RootElement;

            var type = root.GetProperty("Type").GetString()?.ToLower();

            return type switch
            {
                "product" => JsonSerializer.Deserialize<OrderProductDetailRequest>(root.GetRawText(), options),
                "tea" => JsonSerializer.Deserialize<OrderTeaDetailRequest>(root.GetRawText(), options),
                _ => throw new JsonException($"Unknown order detail type: {type}")
            };
        }

        public override void Write(Utf8JsonWriter writer, OrderDetailRequest value, JsonSerializerOptions options)
            => JsonSerializer.Serialize(writer, value, value.GetType(), options);
    }
}
