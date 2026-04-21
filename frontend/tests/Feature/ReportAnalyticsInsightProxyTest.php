<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ReportAnalyticsInsightProxyTest extends TestCase
{
    public function test_analytics_insight_proxy_returns_fastapi_payload(): void
    {
        $payload = [
            'state' => 'ok',
            'generated_at' => '2026-04-19T12:00:00Z',
            'headline' => 'Garbage reports lead',
            'summary' => 'Garbage-related reports are the most common issue.',
            'common_problem' => 'Missed garbage pickup is the dominant problem.',
            'evidence' => [
                ['label' => 'Top category', 'detail' => 'Garbage has the highest report count.'],
            ],
            'recommendations' => [
                ['title' => 'Review collection schedule', 'priority' => 'High', 'details' => 'Coordinate pickups by zone.'],
            ],
        ];

        Http::fake([
            'http://127.0.0.1:8000/analytics/insight' => Http::response($payload, 200),
        ]);

        $response = $this->withoutMiddleware()->getJson('/api/analytics/insight');

        $response->assertOk()->assertExactJson($payload);

        Http::assertSent(function ($request) {
            return $request->url() === 'http://127.0.0.1:8000/analytics/insight'
                && $request->method() === 'GET';
        });
    }
}