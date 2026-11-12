using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models.ReponseModel;
using Seeme.Domain.Models.Tracking;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Service.Tracking
{
    public class TrackingService : ITrackingService
    {
        private readonly IUserTrackingRepository _userTrackingRepository;
        private readonly ITeaRepository _teaRepository;
        private readonly IProductRepository _productRepository;

        public TrackingService(IUserTrackingRepository userTrackingRepository, ITeaRepository teaRepository, IProductRepository productRepository)
        {
            _userTrackingRepository = userTrackingRepository;
            _teaRepository = teaRepository;
            _productRepository = productRepository;
        }

        public async Task<Response<UserTracking>> AddTrackingAsync(int userId, TrackingCreatedModel model)
        {
            try
            {
                var tracking = new UserTracking
                {
                    UserId = userId,
                    Type = model.Type,
                    Action = model.Action,
                    ItemId = model.ItemId,
                    ItemName = model.ItemName
                };

                if (model.Type == TrackingType.Tree)
                {
                    var tree = await _teaRepository.GetByIdAsync(model.ItemId);
                    tracking.Image = tree.Images ?? string.Empty;
                }
                if (model.Type == TrackingType.Product)
                {
                    var product = await _productRepository.GetByIdAsync(model.ItemId);
                    tracking.Image = product.Images ?? string.Empty;
                }
                await _userTrackingRepository.CreateAsync(tracking);

                return new Response<UserTracking>(200, "Ok");
            }
            catch (Exception)
            {
                return new Response<UserTracking>(500, "Add error");
            }
        }

        public async Task<Response<UserTracking>> DeleteTrackingAsync(int trackingId)
        {
            try
            {
                var tracking = await _userTrackingRepository.GetAsync(x => x.Id == trackingId && x.IsDelete == false);
                if (tracking == null)
                {
                    return new Response<UserTracking>(404, "Not found");
                }
                tracking.IsDelete = true;
                await _userTrackingRepository.UpdateAsync(tracking);
                return new Response<UserTracking>(200, "Ok");
            }
            catch (Exception)
            {
                return new Response<UserTracking>(500, "Delete error");
            }
        }

        public async Task<Response<UserTracking>> GetTrackingByIdAsync(int userId, TrackingGetModel model)
        {
            try
            {
                var tracking = await _userTrackingRepository.GetAsync(x => x.UserId == userId && x.ItemId == model.ItemId 
                && x.Type == model.Type && x.Action == x.Action && x.IsDelete == false);

                if (tracking == null)
                {
                    return new Response<UserTracking>(404, "Not found");
                }
                return new Response<UserTracking>(tracking);
            }
            catch (Exception)
            {
                return new Response<UserTracking>(500, "Get error");
            }
        }

        public async Task<Response<List<UserTracking>>> GetTrackingByUserIdAsync(int userId, TrackingAction action)
        {
            try
            {
                var trackings = await Task.FromResult(_userTrackingRepository.GetListAsync(x => x.UserId == userId && x.Action == action && x.IsDelete == false)
                    .OrderByDescending(x => x.CreatedDate)
                    .ToList());

                return new Response<List<UserTracking>>(trackings);
            }
            catch (Exception)
            {
                return new Response<List<UserTracking>>(500, "Get error");
            }
        }
    }
}
