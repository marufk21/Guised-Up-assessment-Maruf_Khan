<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInteractionRequest;
use App\Models\Interaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InteractionController extends Controller
{
    /**
     * Persist one authenticated interaction event without deduplication.
     */
    public function store(StoreInteractionRequest $request): JsonResponse
    {
        $interaction = $request->user()->interactions()->create($request->validated());

        return response()->json([
            'data' => [
                'id' => $interaction->id,
                'user_id' => $interaction->user_id,
                'post_id' => $interaction->post_id,
                'type' => $interaction->type,
                'created_at' => $interaction->created_at?->toISOString(),
            ],
        ], 201);
    }

    /**
     * Remove the authenticated user's latest reaction for a post.
     */
    public function destroyReaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'post_id' => ['required', 'integer', 'exists:posts,id'],
        ]);

        $request->user()
            ->interactions()
            ->where('post_id', $validated['post_id'])
            ->where('type', Interaction::TYPE_REACTION)
            ->latest()
            ->first()
            ?->delete();

        return response()->json([
            'data' => [
                'post_id' => (int) $validated['post_id'],
                'reacted' => false,
            ],
        ]);
    }
}
