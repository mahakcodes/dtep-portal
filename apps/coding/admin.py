from django.contrib import admin

from .models import CodingQuestion, CodingSubmission, CodingTestCase


class CodingTestCaseInline(admin.TabularInline):
    model = CodingTestCase
    extra = 0


@admin.register(CodingQuestion)
class CodingQuestionAdmin(admin.ModelAdmin):
    list_display = ('title', 'test', 'owner', 'max_marks', 'is_published', 'order')
    list_filter = ('is_published',)
    search_fields = ('title', 'test__title', 'owner__username')
    inlines = (CodingTestCaseInline,)


@admin.register(CodingTestCase)
class CodingTestCaseAdmin(admin.ModelAdmin):
    list_display = ('question', 'order', 'is_hidden', 'marks')
    list_filter = ('is_hidden',)


@admin.register(CodingSubmission)
class CodingSubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'question', 'attempt', 'status', 'score', 'created_at')
    list_filter = ('status', 'graded_by')
    search_fields = ('student__username', 'question__title')
