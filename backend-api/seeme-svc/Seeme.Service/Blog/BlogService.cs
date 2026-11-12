using Microsoft.AspNetCore.Http;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Blog;
using Seeme.Domain.Models.ReponseModel;

namespace Seeme.Service.BlogService
{
    public class BlogService : IBlogService
    {
        private readonly IBlogRepository _blogRepository;
        private readonly IContactRepository _contactRepository;

        public BlogService(IBlogRepository blogRepository, IContactRepository contactRepository)
        {
            _blogRepository = blogRepository;
            _contactRepository = contactRepository;
        }

        public async Task<Response<PagingDataModel<Blog>>> GetPaging(PaginationParam param)
        {
            try
            {
                var pagingResult = await _blogRepository.GetPagingByTypeAsync(param);
                return new Response<PagingDataModel<Blog>>(pagingResult);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<Blog>>(StatusCodes.Status500InternalServerError, $"Error while getting blogs: {ex.Message}");
            }
        }

        public async Task<Response<Blog>> GetByIdAsync(int id)
        {
            try
            {
                var blog = await _blogRepository.GetByIdAsync(id);
                if (blog == null)
                {
                    return new Response<Blog>(StatusCodes.Status404NotFound, "Blog not found");
                }
                return new Response<Blog>(blog);
            }
            catch (Exception ex)
            {
                return new Response<Blog>(StatusCodes.Status500InternalServerError, $"Error while getting blog: {ex.Message}");
            }
        }

        public async Task<Response<int>> CreateAsync(CreateBlogInput model, int currentUserId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.Title) || string.IsNullOrWhiteSpace(model.Content))
                {
                    return new Response<int>(StatusCodes.Status400BadRequest, "Title and Content are required");
                }

                var blog = new Blog
                {
                    Title = model.Title.Trim(),
                    CoverImage = model.CoverImage ?? string.Empty,
                    Content = model.Content.Trim(),
                    // Prefer provided author; otherwise use simple indicator with currentUserId
                    Author = string.IsNullOrWhiteSpace(model.Author) ? $"user:{currentUserId}" : model.Author.Trim(),
                    Tags = model.Tags?.Trim(),
                    Type = model.Type
                };

                var created = await _blogRepository.CreateAsync(blog);
                return new Response<int>(created.Id);
            }
            catch (Exception ex)
            {
                return new Response<int>(StatusCodes.Status500InternalServerError, $"Error while creating blog: {ex.Message}");
            }
        }

        public async Task<Response<bool>> UpdateAsync(int id, UpdateBlogInput model, int currentUserId)
        {
            try
            {
                var blog = await _blogRepository.GetByIdAsync(id);
                if (blog == null)
                {
                    return new Response<bool>(StatusCodes.Status404NotFound, "Blog not found");
                }

                // Update fields (preserve existing when appropriate)
                blog.Title = model.Title?.Trim() ?? blog.Title;
                blog.CoverImage = model.CoverImage ?? blog.CoverImage;
                blog.Content = model.Content?.Trim() ?? blog.Content;
                blog.Author = string.IsNullOrWhiteSpace(model.Author) ? blog.Author : model.Author.Trim();
                blog.Tags = model.Tags ?? blog.Tags;
                blog.Type = model.Type;

                await _blogRepository.UpdateAsync(blog);
                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(StatusCodes.Status500InternalServerError, $"Error while updating blog: {ex.Message}");
            }
        }

        public async Task<Response<bool>> DeleteAsync(int id, int currentUserId)
        {
            try
            {
                var blog = await _blogRepository.GetByIdAsync(id);
                if (blog == null)
                {
                    return new Response<bool>(StatusCodes.Status404NotFound, "Blog not found");
                }

                if (blog.IsDelete)
                {
                    return new Response<bool>(StatusCodes.Status400BadRequest, "Blog already deleted");
                }

                blog.IsDelete = true;
                blog.UpdatedDate = DateTime.Now;
                await _blogRepository.UpdateAsync(blog);

                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(StatusCodes.Status500InternalServerError, $"Error while deleting blog: {ex.Message}");
            }
        }

        public async Task<Response<bool>> SendContactAsync(Contact contact)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(contact.Name) || string.IsNullOrWhiteSpace(contact.Email) || string.IsNullOrWhiteSpace(contact.Message))
                {
                    return new Response<bool>(StatusCodes.Status400BadRequest, "Name, Email, and Message are required");
                }

                await _contactRepository.CreateAsync(contact);
                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(StatusCodes.Status500InternalServerError, $"Error while submitting contact: {ex.Message}");
            }
        }

        public async Task<Response<PagingDataModel<Contact>>> GetContactsPaging(PaginationParam param)
        {
            try
            {
                var pagingResult = await _contactRepository.GetPagingAsync<Contact>(param);
                return new Response<PagingDataModel<Contact>>(pagingResult);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<Contact>>(StatusCodes.Status500InternalServerError, $"Error while getting contacts: {ex.Message}");
            }
        }
    }
}