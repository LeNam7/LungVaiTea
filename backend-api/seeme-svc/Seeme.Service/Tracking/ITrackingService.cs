using Seeme.Domain.Entities;
using Seeme.Domain.Models.ReponseModel;
using Seeme.Domain.Models.Tracking;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Service.Tracking
{
    public interface ITrackingService
    {
        Task<Response<UserTracking>> AddTrackingAsync(int userId, TrackingCreatedModel model);
        Task<Response<UserTracking>> GetTrackingByIdAsync(int userId, TrackingGetModel model);
        Task<Response<UserTracking>> DeleteTrackingAsync(int trackingId);
        Task<Response<List<UserTracking>>> GetTrackingByUserIdAsync(int userId, TrackingAction action);
    }
}
