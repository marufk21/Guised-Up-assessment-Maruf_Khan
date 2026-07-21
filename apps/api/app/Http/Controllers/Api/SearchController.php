<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Services\EmbeddingsClient;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class SearchController extends Controller
{
    /**
     * Return PostgreSQL posts in the semantic order supplied by FastAPI.
     */
    public function __invoke(Request $request, EmbeddingsClient $embeddings): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'max:500', 'regex:/\S/u'],
        ]);
        $query = trim($validated['q']);

        try {
            $results = $embeddings->search($query, 10);
        } catch (Throwable) {
            return $this->keywordSearch($query);
        }

        $orderedScores = [];

        foreach ($results as $result) {
            if (preg_match('/^post-(\d+)$/', $result['document_id'], $matches) === 1) {
                $postId = (int) $matches[1];
                $orderedScores[$postId] ??= $result['score'];
            }
        }

        $postsById = Post::query()
            ->with('user:id,name')
            ->whereKey(array_keys($orderedScores))
            ->get()
            ->keyBy('id');

        $posts = collect($orderedScores)
            ->map(function (float $score, int $postId) use ($postsById): ?Post {
                $post = $postsById->get($postId);

                if ($post !== null) {
                    $post->setAttribute('semantic_similarity', round($score, 4));
                }

                return $post;
            })
            ->filter()
            ->take(10)
            ->values();

        if ($posts->isEmpty()) {
            return $this->keywordSearch($query);
        }

        return response()->json([
            'data' => PostResource::collection($posts)->resolve(),
        ]);
    }

    /**
     * Fall back to relational keyword search when semantic search is unavailable.
     */
    private function keywordSearch(string $query): JsonResponse
    {
        $posts = Post::query()
            ->with('user:id,name')
            ->where(function ($builder) use ($query): void {
                $like = '%'.addcslashes($query, '%_\\').'%';

                $builder->where('text', 'like', $like)
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', $like));
            })
            ->latest()
            ->limit(10)
            ->get();

        $this->attachKeywordScores($posts);

        return response()->json([
            'data' => PostResource::collection($posts)->resolve(),
            'meta' => [
                'semantic_search_available' => false,
            ],
        ]);
    }

    /**
     * Keep the mobile search contract stable for fallback results.
     *
     * @param  EloquentCollection<int, Post>  $posts
     */
    private function attachKeywordScores(EloquentCollection $posts): void
    {
        $posts->each(fn (Post $post): Post => $post->setAttribute('semantic_similarity', 0.0));
    }
}
