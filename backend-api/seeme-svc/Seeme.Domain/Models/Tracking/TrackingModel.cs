using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Models.Tracking
{
    public class TrackingCreatedModel
    {
        public TrackingType Type { get; set; }
        public TrackingAction Action { get; set; }
        public int ItemId { get; set; }
        public string ItemName { get; set; }
    }

    public class TrackingGetModel
    {
        public TrackingType Type { get; set; }
        public TrackingAction Action { get; set; }
        public int ItemId { get; set; }
    }
}
